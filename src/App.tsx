
import './App.css';
// import HomePage from './features/layout/HomePage';
// import Footer from './features/components/Footer';
import LoginPage from "./features/layout/login/LoginPage.tsx";
import {Route, Routes} from "react-router";
import RegisterPage from "./features/layout/register/RegisterPage.tsx";
import HomePage from "./features/layout/HomePage.tsx";

function App() {
    return (
        <div className="app">
          <Routes>
            <Route
            path={"/login"}
            element={<LoginPage/>}>
            </Route><Route
            path={"/register"}
            element={<RegisterPage/>}>
            </Route>
            <Route
            path={"/home"}
            element={<HomePage user={""} onCreateFolder={function(): void {
                throw new Error("Function not implemented.");
            } } onOpenRecent={function(): void {
                throw new Error("Function not implemented.");
            } }/>}>
            </Route>
            </Routes>
        </div>
        // <div className="app">
        //     <main className="app-main">
        //         <HomePage user={""} onCreateFolder={function(): void {
        //             throw new Error("Function not implemented.");
        //         } } onOpenRecent={function(): void {
        //             throw new Error("Function not implemented.");
        //         } } />
        //     </main>
        //     <Footer />
        // </div>
    );
}

export default App;
