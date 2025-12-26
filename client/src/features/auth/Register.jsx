import React from 'react'
import { RegisterForm } from '../../components/forms/RegisterForm'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <RegisterForm />
        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/login" className="text-blue-600">Login</a>
        </p>
      </div>
    </div>
  )
}
