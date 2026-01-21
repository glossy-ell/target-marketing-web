export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-white py-4 mt-auto shadow-md">
      <div className="container mx-auto text-center">
        <p className="text-sm opacity-75">© {new Date().getFullYear()} TargetMarketing. All rights reserved.</p>
      </div>
    </footer>
  );
}
