export default function Footer() {
  return (
    <footer className="w-full bg-[#19113f] text-white py-4 mt-auto shadow-md">
      <div className="container mx-auto text-center">
        <p className="text-sm opacity-75">© {new Date().getFullYear()} Elixir. All rights reserved.</p>
      </div>
    </footer>
  );
}
