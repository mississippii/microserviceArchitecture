import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import SignIn from "./pages/Signin.jsx";
import Alumni from "./pages/AlumniHome.jsx";
import BatchDetails from "./pages/BatchDetails.jsx";

function RouteComponent() {
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/alumni" element={<Alumni />} />
                <Route path="/batch/:batchYear" element={<BatchDetails />} />
            </Routes>
            <Footer />
        </BrowserRouter>
    );
}

export default RouteComponent;
