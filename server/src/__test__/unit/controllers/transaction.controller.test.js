/**
 * TRANSACTION CONTROLLER TESTS
 * ============================
 * Unit tests for transaction controller functions
 */

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

jest.mock('../../../models/user.model');
jest.mock('../../../models/transaction.model');

const mongoose = require('mongoose');

// Mock mongoose session and Decimal128
const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
};

const originalStartSession = mongoose.startSession;
mongoose.startSession = jest.fn(() => Promise.resolve(mockSession));

const originalDecimal128 = mongoose.Types.Decimal128;
mongoose.Types.Decimal128.fromString = jest.fn((val) => ({ toString: () => val }));

const { transferFunds, getUserTransactions } = require('../../../controllers/transaction.controller');
const User = require('../../../models/user.model');
const Transaction = require('../../../models/transaction.model');

describe('Transaction Controller - Unit Tests', () => {
    describe('transferFunds', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                user: {
                    id: 'user1_id',
                },
                body: {
                    to: 'user2_id',
                    amount: 100,
                },
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            next = jest.fn();
            jest.clearAllMocks();
        });

        test('should transfer funds successfully', async () => {
            const fromUser = {
                _id: 'user1_id',
                wallet: { balance: { toString: () => '500' } },
                save: jest.fn(),
            };
            const toUser = {
                _id: 'user2_id',
                wallet: { balance: { toString: () => '200' } },
                save: jest.fn(),
            };

            User.findById.mockImplementation((id) => {
                return {
                    session: jest.fn().mockResolvedValue(
                        id === 'user1_id' ? fromUser : 
                        id === 'user2_id' ? toUser : null
                    ),
                };
            });

            const mockTransactionSave = jest.fn();
            Transaction.mockImplementation(() => ({
                save: mockTransactionSave,
            }));

            await transferFunds(req, res, next);

            expect(mongoose.startSession).toHaveBeenCalled();
            expect(mockSession.startTransaction).toHaveBeenCalled();
            
            expect(fromUser.wallet.balance.toString()).toBe('400');
            expect(toUser.wallet.balance.toString()).toBe('300');

            expect(fromUser.save).toHaveBeenCalledWith({ session: mockSession });
            expect(toUser.save).toHaveBeenCalledWith({ session: mockSession });
            expect(mockTransactionSave).toHaveBeenCalledWith({ session: mockSession });

            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Funds transferred successfully',
            }));
        });

        test('should return 404 if sender not found', async () => {
            User.findById.mockImplementation(() => ({
                session: jest.fn().mockResolvedValue(null),
            }));

            await transferFunds(req, res, next);

            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Sender or recipient not found',
            });
        });

        test('should return 404 if recipient not found', async () => {
            const fromUser = {
                _id: 'user1_id',
                wallet: { balance: { toString: () => '500' } },
                save: jest.fn(),
            };

            User.findById.mockImplementation((id) => ({
                session: jest.fn().mockResolvedValue(
                    id === 'user1_id' ? fromUser : null
                ),
            }));

            await transferFunds(req, res, next);

            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 400 if insufficient funds', async () => {
            const fromUser = {
                _id: 'user1_id',
                wallet: { balance: { toString: () => '50' } },
                save: jest.fn(),
            };
            const toUser = {
                _id: 'user2_id',
                wallet: { balance: { toString: () => '200' } },
                save: jest.fn(),
            };

            User.findById.mockImplementation((id) => ({
                session: jest.fn().mockResolvedValue(
                    id === 'user1_id' ? fromUser : toUser
                ),
            }));

            await transferFunds(req, res, next);

            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Insufficient funds',
            });
        });

        test('should handle exact balance transfer', async () => {
            req.body.amount = 500;

            const fromUser = {
                _id: 'user1_id',
                wallet: { balance: { toString: () => '500' } },
                save: jest.fn(),
            };
            const toUser = {
                _id: 'user2_id',
                wallet: { balance: { toString: () => '200' } },
                save: jest.fn(),
            };

            User.findById.mockImplementation((id) => ({
                session: jest.fn().mockResolvedValue(
                    id === 'user1_id' ? fromUser : toUser
                ),
            }));

            const mockTransactionSave = jest.fn();
            Transaction.mockImplementation(() => ({
                save: mockTransactionSave,
            }));

            await transferFunds(req, res, next);

            expect(fromUser.wallet.balance.toString()).toBe('0');
            expect(toUser.wallet.balance.toString()).toBe('700');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should handle errors and call next(error)', async () => {
            const error = new Error('Database error');
            User.findById.mockImplementation(() => {
                throw error;
            });

            await transferFunds(req, res, next);

            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(error);
        });

        test('should abort transaction on save error', async () => {
            const fromUser = {
                _id: 'user1_id',
                wallet: { balance: { toString: () => '500' } },
                save: jest.fn().mockRejectedValue(new Error('Save failed')),
            };
            const toUser = {
                _id: 'user2_id',
                wallet: { balance: { toString: () => '200' } },
                save: jest.fn(),
            };

            User.findById.mockImplementation((id) => ({
                session: jest.fn().mockResolvedValue(
                    id === 'user1_id' ? fromUser : toUser
                ),
            }));

            await transferFunds(req, res, next);

            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        test('should create transaction with correct data', async () => {
            const fromUser = {
                _id: 'user1_id',
                wallet: { balance: { toString: () => '500' } },
                save: jest.fn(),
            };
            const toUser = {
                _id: 'user2_id',
                wallet: { balance: { toString: () => '200' } },
                save: jest.fn(),
            };

            User.findById.mockImplementation((id) => ({
                session: jest.fn().mockResolvedValue(
                    id === 'user1_id' ? fromUser : toUser
                ),
            }));

            let transactionData;
            Transaction.mockImplementation((data) => {
                transactionData = data;
                return {
                    save: jest.fn(),
                };
            });

            await transferFunds(req, res, next);

            expect(transactionData).toMatchObject({
                type: 'transfer',
                from: 'user1_id',
                to: 'user2_id',
                amount: 100,
                fromBalanceBefore: 500,
                fromBalanceAfter: 400,
                toBalanceBefore: 200,
                toBalanceAfter: 300,
            });
        });
    });

    describe('getUserTransactions', () => {
        test('should be defined', () => {
            expect(getUserTransactions).toBeDefined();
        });
    });
});
