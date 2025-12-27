import { createFileRoute } from '@tanstack/react-router';
import { AuthModal } from '../components/modals/AuthModal';



export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div>
      <AuthModal open={true} onCancel={() => {}} />

    </div>
  );
}
