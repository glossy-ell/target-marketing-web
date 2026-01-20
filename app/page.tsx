import LoginForm from './components/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <div className="flex-1 flex justify-center items-center py-12">
        <LoginForm />
      </div>
    </div>
  );
}
