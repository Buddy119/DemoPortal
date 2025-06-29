import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white shadow">
      <span className="text-lg font-bold text-blue-700">Dev Portal</span>
      <nav className="flex items-center">
        <Link to="/" className="text-sm text-gray-600 hover:text-blue-700 ml-6">
          Home
        </Link>
      </nav>
    </header>
  );
};

export default Navbar;
