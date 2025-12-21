import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  Key,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface UserWithDetails {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  plan_id: string | null;
  roles: { role: string }[];
}

interface UserRole {
  user_id: string;
  role: 'user' | 'admin' | 'super_admin';
}

const ITEMS_PER_PAGE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>('user');

  const fetchUsersCallback = useCallback(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterActive, filterRole]);

  // Subscribe to realtime profile and role changes
  useRealtimeSync(
    [
      { table: 'profiles', event: '*', callback: fetchUsersCallback },
      { table: 'user_roles', event: '*', callback: fetchUsersCallback },
    ],
    [fetchUsersCallback]
  );

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterActive, filterRole]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filterActive === 'active') {
        query = query.eq('is_active', true);
      } else if (filterActive === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: profiles, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Fetch roles for each user
      const userIds = profiles?.map(p => p.id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: rolesData?.filter(r => r.user_id === profile.id) || []
      })) || [];

      // Filter by role if needed
      let filteredUsers = usersWithRoles;
      if (filterRole !== 'all') {
        filteredUsers = usersWithRoles.filter(u => 
          u.roles.some(r => r.role === filterRole)
        );
      }

      setUsers(filteredUsers);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: !isActive } : u
      ));

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: !isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entity_type: 'user',
        entity_id: userId,
        new_values: { is_active: !isActive },
      });

      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;

    try {
      // Check if user already has this role
      const existingRole = selectedUser.roles.find(r => r.role === newRole);
      
      if (existingRole) {
        toast.info('User already has this role');
        return;
      }

      // Remove existing roles and add new one
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: newRole as 'user' | 'admin' | 'super_admin',
        });

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        action: 'ROLE_CHANGED',
        entity_type: 'user',
        entity_id: selectedUser.id,
        old_values: { roles: selectedUser.roles },
        new_values: { role: newRole },
      });

      setShowRoleDialog(false);
      fetchUsers();
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const updateUserCredits = async (userId: string, credits: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, credits } : u
      ));

      toast.success('Credits updated successfully');
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Failed to update credits');
    }
  };

  const exportUsers = () => {
    const headers = ['Email', 'Name', 'Credits', 'Status', 'Roles', 'Joined', 'Last Login'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.email,
        user.full_name || '',
        user.credits,
        user.is_active ? 'Active' : 'Inactive',
        user.roles.map(r => r.role).join(';'),
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.last_login ? format(new Date(user.last_login), 'yyyy-MM-dd') : 'Never',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getRoleBadge = (roles: { role: string }[]) => {
    if (roles.some(r => r.role === 'super_admin')) {
      return <Badge className="bg-red-500/20 text-red-400">Super Admin</Badge>;
    }
    if (roles.some(r => r.role === 'admin')) {
      return <Badge className="bg-amber-500/20 text-amber-400">Admin</Badge>;
    }
    return <Badge variant="secondary">User</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all platform users ({totalCount} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="super_admin">Super Admins</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">User</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Credits</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Role</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Joined</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Last Login</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground mt-2">Loading users...</p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <p className="text-muted-foreground">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-foreground">
                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {user.full_name || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-foreground">{user.credits}</span>
                        </td>
                        <td className="py-4 px-6">
                          {getRoleBadge(user.roles)}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {user.last_login
                            ? format(new Date(user.last_login), 'MMM dd, yyyy')
                            : 'Never'}
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowDetailsDialog(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                              >
                                {user.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.roles[0]?.role || 'user');
                                setShowRoleDialog(true);
                              }}>
                                <Shield className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateUserRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="text-2xl font-bold">{selectedUser.credits}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={selectedUser.is_active ? 'bg-emerald-500/20 text-emerald-400 mt-1' : 'bg-destructive/20 text-destructive mt-1'}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{format(new Date(selectedUser.created_at), 'PPP')}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="font-medium">
                    {selectedUser.last_login 
                      ? format(new Date(selectedUser.last_login), 'PPP')
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setShowDetailsDialog(false);
                  setShowRoleDialog(true);
                }}>
                  <Shield className="h-4 w-4 mr-2" />
                  Change Role
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
