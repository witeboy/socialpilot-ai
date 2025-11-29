import Home from './pages/Home';
import Create from './pages/Create';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Create": Create,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};