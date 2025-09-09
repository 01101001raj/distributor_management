import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/mockApiService';
import { User, UserRole } from '../types';
import { ROLES } from '../constants';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { PlusCircle, Edit, Save, X, Trash2 } from 'lucide-react';

const UserManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editedUser, setEditedUser] = useState<Partial<User>>({});

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err) {
            setError("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === UserRole.SUPER_ADMIN) {
            fetchUsers();
        }
    }, [currentUser]);

    const handleAddNew = () => {
        setIsAdding(true);
        setEditedUser({ username: '', password: '', role: UserRole.USER });
        setEditingUserId('new');
    };

    const handleEdit = (user: User) => {
        setEditingUserId(user.id);
        setEditedUser({ ...user, password: '' }); // Clear password for editing form
    };

    const handleCancel = () => {
        setEditingUserId(null);
        setIsAdding(false);
        setEditedUser({});
        setError(null);
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setLoading(true);
            try {
                await api.deleteUser(userId, currentUser!.id, currentUser!.role);
                fetchUsers();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete user.");
                setLoading(false);
            }
        }
    };
    
    const handleSave = async () => {
        if (!editedUser.username || (!editedUser.password && isAdding) || !editedUser.role) {
            setError("Username, password (for new users), and role are required.");
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            if (isAdding) {
                await api.addUser({
                    username: editedUser.username,
                    password: editedUser.password!,
                    role: editedUser.role,
                }, currentUser!.role);
            } else {
                const userToUpdate = users.find(u => u.id === editingUserId)!;
                const finalUserData: Partial<User> = { ...userToUpdate, ...editedUser };
                if (!editedUser.password) {
                    delete finalUserData.password; // Don't send empty password to API
                }
                await api.updateUser(finalUserData as User, currentUser!.role);
            }
            fetchUsers();
            handleCancel();
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to save user.");
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setEditedUser(prev => ({ ...prev, [name]: value }));
    };

    if (currentUser?.role !== UserRole.SUPER_ADMIN) {
        return <Card className="text-center"><p className="text-text-secondary">You do not have permission to manage users.</p></Card>;
    }

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">User Management</h2>
                <Button onClick={handleAddNew} disabled={isAdding || loading}><PlusCircle size={16} className="mr-2"/> Add New User</Button>
            </div>
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">{error}</div>}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 w-1/4 text-sm font-semibold text-black">Username</th>
                            <th className="p-3 w-1/4 text-sm font-semibold text-black">Role</th>
                            <th className="p-3 w-1/4 text-sm font-semibold text-black">Password</th>
                            <th className="p-3 w-1/4 text-sm font-semibold text-black text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdding && (
                             <tr className="bg-blue-50">
                                <td className="p-2"><Input label="" id="username" name="username" value={editedUser.username || ''} onChange={handleInputChange} /></td>
                                <td className="p-2">
                                    <Select label="" id="role" name="role" value={editedUser.role} onChange={handleInputChange}>
                                        {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                    </Select>
                                </td>
                                <td className="p-2">
                                    <Input label="" id="password" name="password" placeholder="Set Password" type="password" value={editedUser.password || ''} onChange={handleInputChange} />
                                </td>
                                <td className="p-2 text-right space-x-2">
                                    <Button onClick={handleSave} variant="primary" size="sm" className="p-2" isLoading={loading}><Save size={16}/></Button>
                                    <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16}/></Button>
                                </td>
                            </tr>
                        )}
                        {users.map(user => (
                            editingUserId === user.id ? (
                                <tr key={user.id} className="bg-blue-50">
                                    <td className="p-2"><p className="font-semibold px-3 py-2">{user.username}</p></td>
                                    <td className="p-2">
                                        <Select label="" id="role" name="role" value={editedUser.role} onChange={handleInputChange}>
                                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                        </Select>
                                    </td>
                                    <td className="p-2">
                                        <Input label="" id="password" name="password" placeholder="New Password (optional)" type="password" value={editedUser.password || ''} onChange={handleInputChange} />
                                    </td>
                                    <td className="p-2 text-right space-x-2">
                                        <Button onClick={handleSave} variant="primary" size="sm" className="p-2" isLoading={loading}><Save size={16}/></Button>
                                        <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16}/></Button>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{user.username}</td>
                                    <td className="p-3">{user.role}</td>
                                    <td className="p-3 text-xs italic text-gray-400">Hidden</td>
                                    <td className="p-3 text-right space-x-2">
                                        {currentUser?.id !== user.id ? (
                                            <>
                                                <Button onClick={() => handleEdit(user)} variant="secondary" size="sm" className="p-2"><Edit size={16}/></Button>
                                                <Button onClick={() => handleDelete(user.id)} variant="danger" size="sm" className="p-2" isLoading={loading}><Trash2 size={16}/></Button>
                                            </>
                                        ) : (
                                            <span className="text-xs text-text-secondary italic">Cannot edit/delete self</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default UserManagement;
