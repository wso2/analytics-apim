import { createMuiTheme } from "@material-ui/core/styles";
export const dark = createMuiTheme({
  typography: {
    useNextVariants: true
  },
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

    MuiInputLabel: {
      root: {
        color: "#ffffff"
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
        width: 130,
        margin: 5,
        fontSize: 13
      },
      icon: {
        color: "#756e71"
      }
    }
  }
});

export const light = createMuiTheme({
  typography: {
    useNextVariants: true
  },
  overrides: {
    MuiGrid: {
      container: {
        background: "ffffff",
        color: "#ffffff"
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
    MuiButton: {
      root: {
        color: "#000",
        textTransform: "none"
      }
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
    }
  }
});
