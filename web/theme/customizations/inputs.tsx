import { Theme, Components } from '@mui/material/styles'

export const inputsCustomizations: Components<Theme> = {
  MuiFormControl: {
    styleOverrides: {
      root: ({ theme }) => ({
        [theme.breakpoints.up('sm')]: {
          flexDirection: 'row',
        },

        '& .MuiFormHelperText-root': {
          position: 'absolute',
          bottom: theme.spacing(-2.5),
          marginInline: theme.spacing(1),
        },
      }),
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        typography: theme.typography.caption,
        lineHeight: '1.75em',
        [theme.breakpoints.up('sm')]: {
          flexBasis: 100,
          flexShrink: 0,
          lineHeight: '3.1em',
        },
      }),
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      input: ({ theme }) => ({
        paddingInline: theme.spacing(1),
        paddingBlock: '0.8em',
        height: '1.5em',
      }),

      multiline: {
        padding: 0,
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      multiline: {
        padding: 0,
      },
    },
  },
}
