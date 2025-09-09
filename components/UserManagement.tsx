


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
import { useForm, SubmitHandler } from 'react-hook-form';

const UserManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<Partial<User>>({
        mode: 'onBlur',
    });

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
        setEditingUserId('new');
        reset({ username: '', password: '', role: UserRole.USER });
    };

    const handleEdit = (user: User) => {
        setEditingUserId(user.id);
        reset({ ...user, password: '' });
    };

    const handleCancel = () => {
        setEditingUserId(null);
        reset({});
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
            } finally {
                setLoading(false);
            }
        }
    };
    
    const onSave: SubmitHandler<Partial<User>> = async (data) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            if (editingUserId === 'new') {
                await api.addUser({
                    username: data.username!,
                    password: data.password!,
                    role: data.role!,
                }, currentUser.role);
            } else {
                const finalUserData = { ...data, id: editingUserId! };
                if (!finalUserData.password) {
                    delete finalUserData.password;
                }
                await api.updateUser(finalUserData as User, currentUser.role);
            }
            fetchUsers();
            handleCancel();
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to save user.");
        } finally {
            setLoading(false);
        }
    };

    if (currentUser?.role !== UserRole.SUPER_ADMIN) {
        return <Card className="text-center"><p className="text-text-secondary">You do not have permission to manage users.</p></Card>;
    }
    
    const renderEditRow = () => (
        <tr className="bg-blue-50">
            <td className="p-2">
                <Input
                    {...register('username', { required: 'Username is required' })}
                    error={errors.username?.message}
                    disabled={editingUserId !== 'new'}
                />
            </td>
            <td className="p-2">
                <Select {...register('role', { required: 'Role is required' })}>
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </Select>
            </td>
            <td className="p-2">
                <Input
                    placeholder={editingUserId === 'new' ? 'Set Password' : 'New Password (optional)'}
                    type="password"
                    {...register('password', { required: editingUserId === 'new' ? 'Password is required' : false })}
                    error={errors.password?.message}
                />
            </td>
            <td className="p-2 text-right space-x-2">
                <Button onClick={handleSubmit(onSave)} variant="primary" size="sm" className="p-2" isLoading={loading} disabled={!isValid}><Save size={16}/></Button>
                <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16}/></Button>
            </td>
        </tr>
    );

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">User Management</h2>
                <Button onClick={handleAddNew} disabled={!!editingUserId || loading} className="w-full sm:w-auto"><PlusCircle size={16} className="mr-2"/> Add New User</Button>
            </div>
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-background">
                        <tr className="border-b border-border">
                            <th className="p-3 w-1/4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Username</th>
                            <th className="p-3 w-1/4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Role</th>
                            <th className="p-3 w-1/4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Password</th>
                            <th className="p-3 w-1/4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {editingUserId === 'new' && renderEditRow()}
                        {users.map(user => (
                            editingUserId === user.id ? (
                                renderEditRow()
                            ) : (
                                <tr key={user.id} className="border-b border-border hover:bg-background">
                                    <td className="p-3 font-medium">{user.username}</td>
                                    <td className="p-3">{user.role}</td>
                                    <td className="p-3 text-xs italic text-text-secondary">Hidden</td>
                                    <td className="p-3 text-right space-x-2">
                                        {currentUser?.id !== user.id ? (
                                            <>
                                                <Button onClick={() => handleEdit(user)} variant="secondary" size="sm" className="p-2" disabled={!!editingUserId}><Edit size={16}/></Button>
                                                <Button onClick={() => handleDelete(user.id)} variant="danger" size="sm" className="p-2" isLoading={loading} disabled={!!editingUserId}><Trash2 size={16}/></Button>
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