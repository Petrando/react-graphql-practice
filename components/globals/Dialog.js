import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function FormDialog({token, setToken, tokenError, startFetch}) {
  return (
    <div>
      <Dialog open={true}>
        <DialogTitle>Github PAT</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To use this app, please enter your GitHub Personal Access Token
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="pat"
            label={`${tokenError?"PAT error! Gimme your real PAT":"Gimme PAT"}`}
            type="text"
            fullWidth
            variant="standard"
            value={token}
            onChange={e=>{setToken(e.target.value)}}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={token===''} onClick={startFetch}>Ok</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
