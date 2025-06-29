import { NavLink } from 'react-router-dom';

const SidebarItem = ({ api }) => {
  return (
    <NavLink
      to={`/docs/${api.id}`}
      className={({ isActive }) =>
        `block px-4 py-2 text-sm ${
          isActive ? 'bg-gray-100 border-l-4 border-blue-500 text-blue-700 font-medium' : 'hover:bg-gray-100 hover:text-blue-700'
        }`
      }
    >
      {api.name}
    </NavLink>
  );
};

export default SidebarItem;
