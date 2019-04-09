import { createMuiTheme } from "@material-ui/core/styles";
export const dark = createMuiTheme({
  overrides: {
    MuiPopover: {
      paper: {
        borderRadius: 0
      }
    },
    MuiGrid: {
      container: {
        backgroundColor: "#323435"
      }
    },
    MuiButton: {
      root: {
        color: "#ffffff",
        textTransform: "none",
        "&:hover": {
          backgroundColor: "#444"
        }
      }
    },
    MuiList: {
      root: {
        backgroundColor: "#303030"
      },
      padding: 0
    },
    MuiInput: {
      root: {
        color: "#ffffff",
        fontSize: 13
      },
      underline: {
        "&:before": {
          borderBottomColor: "#ffffff"
        },
        "&:after": {
          borderBottomColor: "#ffffff"
        }
      }
    },
    MuiMenuItem: {
      root: {
        "&:hover": {
          backgroundColor: "#444"
        },
        color: "#ffffff",
        fontSize: 15,
        backgroundColor: "#303030"
      }
    },
    MuiSelect: {
      root: {
        color: "#ffffff",
        width: 120,
        margin: 5,
        fontSize: 13
      },
      icon: {
        color: "#756e71"
      }
    },
    typography: {
      root: {
        color: "#ffffff"
      },
      useNextVariants: true
    }
  }
});

export const light = createMuiTheme({
  overrides: {
    MuiPopover: {
      paper: {
        borderRadius: 0
      }
    },
    MuiGrid: {
      container: {
        background: "ffffff",
        color: "#ffffff"
      }
    },
    MuiButton: {
      root: {
        color: "#000",
        textTransform: "none"
      }
    },
    MuiList: {
      root: {
        backgroundColor: "#ffffff"
      },
      padding: 0
    },

    MuiInput: {
      root: {
        color: "#000",
        fontSize: 13
      },
      underline: {
        "&:before": {
          borderBottomColor: "#000"
        },
        "&:after": {
          borderBottomColor: "#000"
        }
      }
    },
    MuiMenuItem: {
      root: {
        color: "#000",
        fontSize: 15,
        backgroundColor: "#ffffff"
      }
    },
    MuiSelect: {
      root: {
        color: "#000",
        width: 120,
        margin: 5,
        fontSize: 13
      }
    },
    typography: {
      root: {
        color: "#000"
      },
      useNextVariants: true
    }
  }
});
