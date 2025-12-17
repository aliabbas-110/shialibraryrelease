import "@fontsource/roboto";
import Navbar from "../components/Navbar/Navbar.jsx";
import theme from '../assets/theme.js'
import Hero from "../components/Hero/Hero.jsx";
import Coffee from "../components/Coffee/Coffee.jsx";
import { ThemeProvider } from "@mui/material";


export function Home () {
  return (
    <>
        <Hero/>
        <Coffee/>

    </>
  )
}