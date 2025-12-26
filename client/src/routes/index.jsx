import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome to Smart City Bank</h3>
      <p>Secure, Fast, Connected.</p>
    </div>
  );
}
