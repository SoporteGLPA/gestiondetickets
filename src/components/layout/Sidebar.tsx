import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { CircleUserRound, Menu } from 'lucide-react';
import { NavLink } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const { profile } = useAuth();
  const isAdminOrAgent = profile?.role === 'admin' || profile?.role === 'agent';

  return (
    <aside className="hidden md:flex flex-col w-[200px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <span className="font-bold text-lg">Menú</span>
      </div>
      <nav className="flex flex-col flex-1 p-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center px-2 py-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive
              ? 'bg-gray-100 dark:bg-gray-700 font-medium'
              : 'font-normal'
            }`
          }
        >
          Inicio
        </NavLink>
        <NavLink
          to="/tickets"
          className={({ isActive }) =>
            `flex items-center px-2 py-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive
              ? 'bg-gray-100 dark:bg-gray-700 font-medium'
              : 'font-normal'
            }`
          }
        >
          Tickets
        </NavLink>
        <NavLink
          to="/knowledge"
          className={({ isActive }) =>
            `flex items-center px-2 py-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive
              ? 'bg-gray-100 dark:bg-gray-700 font-medium'
              : 'font-normal'
            }`
          }
        >
          Conocimiento
        </NavLink>
        {isAdminOrAgent && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive
                ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                : 'font-normal'
              }`
            }
          >
            Usuarios
          </NavLink>
        )}
        {isAdminOrAgent && (
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive
                ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                : 'font-normal'
              }`
            }
          >
            Reportes
          </NavLink>
        )}
        {isAdminOrAgent && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive
                ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                : 'font-normal'
              }`
            }
          >
            Configuración
          </NavLink>
        )}
      </nav>
      <Separator />
      <nav className="p-2">
        <a href="/profile" className="flex items-center px-2 py-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 font-normal">Mi Perfil</a>
      </nav>
    </aside>
  )
}
export default Sidebar;
