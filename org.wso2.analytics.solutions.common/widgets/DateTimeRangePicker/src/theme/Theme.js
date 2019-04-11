/*
 * Copyright (c) 2018, WSO2 Inc. (http://wso2.com) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createMuiTheme } from '@material-ui/core/styles';

export const dark = createMuiTheme({
    overrides: {
        MuiPopover: {
            paper: {
                borderRadius: 0
            }
        },
        MuiGrid: {
            container: {
                backgroundColor: '#323435'
            }
        },
        MuiButton: {
            root: {
                color: '#ffffff',
                textTransform: 'none',
                '&:hover': {
                    backgroundColor: '#444'
                }
            }
        },
        MuiList: {
            root: {
                backgroundColor: '#303030'
            },
            padding: 0
        },
        MuiInput: {
            root: {
                color: '#ffffff',
                fontSize: 13
            },
            underline: {
                '&:before': {
                    borderBottomColor: '#ffffff'
                },
                '&:after': {
                    borderBottomColor: '#ffffff'
                }
            }
        },
        MuiMenuItem: {
            root: {
                '&:hover': {
                    backgroundColor: '#444'
                },
                color: '#ffffff',
                fontSize: 15,
                backgroundColor: '#303030'
            }
        },
        MuiSelect: {
            root: {
                color: '#ffffff',
                width: 120,
                margin: 5,
                fontSize: 13
            },
            icon: {
                color: '#756e71'
            }
        },
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
                background: '#ffffff',
                color: '#ffffff'
            }
        },
        MuiButton: {
            root: {
                color: '#000',
                textTransform: 'none'
            }
        },
        MuiList: {
            root: {
                backgroundColor: '#ffffff'
            },
            padding: 0
        },

        MuiInput: {
            root: {
                color: '#000',
                fontSize: 13
            },
            underline: {
                '&:before': {
                    borderBottomColor: '#000'
                },
                '&:after': {
                    borderBottomColor: '#000'
                }
            }
        },
        MuiMenuItem: {
            root: {
                color: '#000',
                fontSize: 15,
                backgroundColor: '#ffffff'
            }
        },
        MuiSelect: {
            root: {
                color: '#000',
                width: 120,
                margin: 5,
                fontSize: 13
            }
        },
    }
});
