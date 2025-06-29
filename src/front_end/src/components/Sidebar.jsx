import { apiData } from '../data/apis.js';
import SidebarItem from './SidebarItem.jsx';

const groups = [{ title: 'APIs', apis: apiData.apis }];

const Sidebar = () => {
  return (
    <div className="w-72 border-r overflow-y-auto">
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="px-4 pt-6 pb-2 text-xs font-semibold text-gray-500">
            {group.title}
          </h3>
          {group.apis.map((api) => (
            <SidebarItem key={api.id} api={api} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
