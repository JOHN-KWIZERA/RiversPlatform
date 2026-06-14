import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-md bg-brand-50 flex items-center justify-center mb-6">
        <Compass size={32} className="text-brand-400" />
      </div>
      <h1 className="text-6xl font-black text-[#001E2B] mb-2">404</h1>
      <h2 className="text-xl font-bold text-[#001E2B] mb-3">Page not found</h2>
      <p className="text-gray-500 max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="ghost" leftIcon={<ArrowLeft size={15} />} onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go home
        </Button>
      </div>
    </div>
  );
}
