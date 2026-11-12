import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  Users,
  GraduationCap,
  CalendarDays,
  LogOut,
  UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/auth";

type SimpleItem = {
  title: string;
  url: "/" | "/dashboard" | "/colaboradores" | "/estagios" | "/ferias" | "/perfil";
  icon: typeof Home;
};

const items: SimpleItem[] = [
  { title: "Página Inicial", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Colaboradores", url: "/colaboradores", icon: Users },
  { title: "Estágios", url: "/estagios", icon: GraduationCap },
  { title: "Férias", url: "/ferias", icon: CalendarDays },
];

const perfilItem: SimpleItem = { title: "Meu perfil", url: "/perfil", icon: UserCircle };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { signOut, displayName, isAdmin } = useAuth();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const itemClass = (active: boolean) =>
    "relative flex items-center gap-3 rounded-md px-3 transition-colors " +
    (active
      ? "before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-success bg-sidebar-accent font-semibold text-primary"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-transparent">
        <div className="flex items-center justify-center px-2 py-3">
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-1 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/50 px-3">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} className="h-10">
                      <Link to={item.url} className={itemClass(active)}>
                        <item.icon className={"h-[18px] w-[18px] shrink-0 " + (active ? "text-primary" : "")} />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Perfil */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(perfilItem.url)} className="h-10">
                  <Link to={perfilItem.url} className={itemClass(isActive(perfilItem.url))}>
                    <perfilItem.icon className={"h-[18px] w-[18px] shrink-0 " + (isActive(perfilItem.url) ? "text-primary" : "")} />
                    {!collapsed && <span className="text-sm">{perfilItem.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 pt-3 pb-1 text-xs text-sidebar-foreground/70">
            <div className="truncate font-semibold text-sidebar-foreground">{displayName}</div>
            <div className="truncate text-[11px]">{isAdmin ? "Administrador" : "Colaborador"}</div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
