import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CalendarDays, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
        <CalendarDays className="w-8 h-8 text-indigo-600" />
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-lg text-gray-500 mb-8">Sahifa topilmadi</p>
      <Link to="/">
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Home className="w-4 h-4 mr-2" />
          Bosh sahifaga qaytish
        </Button>
      </Link>
    </div>
  );
}