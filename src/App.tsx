
import HomePage from "./features/layout/HomePage";
import Footer from "./features/components/Footer";

function App() {
    const user = "Matteo";

    const handleCreateFolder = () => {
        console.log("Créer un dossier");
    };

    const handleOpenRecent = () => {
        console.log("Ouvrir un dossier récent");
    };

    return (
        <>
            <HomePage
                user={user}
                onCreateFolder={handleCreateFolder}
                onOpenRecent={handleOpenRecent}
            />
            <Footer />
        </>
    );
}

export default App;
