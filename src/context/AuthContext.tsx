import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import { clearSession,getSession,login as loginApi,register as registerApi,type User } from '../services/authService';
type Auth={user:User|null;loading:boolean;login:(e:string,p:string)=>Promise<void>;register:(n:string,e:string,p:string)=>Promise<void>;logout:()=>Promise<void>};
const C=createContext<Auth|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{getSession().then(s=>setUser(s?.user??null)).finally(()=>setLoading(false))},[]);
 const value:Auth={user,loading,login:async(e,p)=>{setUser(await loginApi(e,p))},register:async(n,e,p)=>{setUser(await registerApi(n,e,p))},logout:async()=>{await clearSession();setUser(null)}};
 return <C.Provider value={value}>{children}</C.Provider>;
}
export function useAuth(){const v=useContext(C);if(!v)throw new Error('AuthProvider missing');return v}
