import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily:'"Ubuntu", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,' + 
                'Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',            
  },
  breakpoints: {
    values: {
      mobile: 414,      
      midScreen: 415,
      largeScreen:1440,//1440 theme.breakpoints.up is (INCLUSIVE)
    },
  },
  margin:0
})

export default theme;