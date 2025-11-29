import Home from './pages/Home';
import Create from './pages/Create';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Create": Create,
    "Feed": Feed,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};