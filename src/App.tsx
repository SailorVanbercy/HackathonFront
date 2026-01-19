
import './App.css';
import HomePage from './features/layout/HomePage';
import Footer from './features/components/Footer';

function App() {
    return (
        <div className="app">
            <main className="app-main">
                <HomePage user={""} onCreateFolder={function(): void {
                    throw new Error("Function not implemented.");
                } } onOpenRecent={function(): void {
                    throw new Error("Function not implemented.");
                } } />
            </main>
            <Footer />
        </div>
    );
}

export default App;
