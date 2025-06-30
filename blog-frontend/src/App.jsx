// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/LoginPage.jsx';
import Posts from './pages/PostsPage.jsx';
import NewPost from './pages/NewPostPage.jsx';
import { useContext } from 'react'; import { AuthCtx } from './context/AuthContext.jsx';
import NavBar from './components/NavBar.jsx';

export default function App() {
  const { token } = useContext(AuthCtx);
  return <>
    <NavBar/>
    <Routes>
      <Route path="/login" element={!token ? <Login/> : <Navigate to="/"/>}/>
      <Route path="/" element={<Posts/>}/>
      <Route path="/new" element={token ? <NewPost/> : <Navigate to="/login"/>}/>
    </Routes>
  </>;
}
