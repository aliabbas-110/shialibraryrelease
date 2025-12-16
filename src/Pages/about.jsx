import "@fontsource/roboto";
import Navbar from "../components/Navbar/Navbar.jsx";
import theme from '../assets/theme.js'

import { ThemeProvider } from "@mui/material";


export function About () {
    return (
        <>
      <ThemeProvider theme={theme}>
        <Navbar />
    </ThemeProvider>
        
        </>
    )
}