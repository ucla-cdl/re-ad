import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Box, TextField, Button, Typography, IconButton } from '@mui/material';
import { Group, Delete, ArrowBack } from '@mui/icons-material';

type ContextMenuProps = {
  open: boolean;
  anchorPosition: { top: number; left: number } | undefined;
  onClose: () => void;
  onCreateGroup: (label: string) => void;
  onDeleteSelected: () => void;
  selectedCount: number;
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  open,
  anchorPosition,
  onClose,
  onCreateGroup,
  onDeleteSelected,
  selectedCount,
}) => {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupLabel, setGroupLabel] = useState('');

  const handleCreateGroupClick = () => {
    setShowGroupForm(true);
    setGroupLabel(`Group (${selectedCount} nodes)`);
  };

  const handleCreateGroupSubmit = () => {
    if (groupLabel.trim()) {
      onCreateGroup(groupLabel.trim());
      setShowGroupForm(false);
      setGroupLabel('');
    }
  };

  const handleBackToMenu = () => {
    setShowGroupForm(false);
    setGroupLabel('');
  };

  useEffect(() => {
    setShowGroupForm(false);
    setGroupLabel('');
  }, [open]);

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      slotProps={{
        paper: {
          style: {
            height: "min-content",
            width: "min-content",
          },
        },
      }}
    >
      {!showGroupForm ? (
        // Main menu
        <>
          {selectedCount > 1 && (
            <MenuItem onClick={handleCreateGroupClick}>
              <ListItemIcon>
                <Group fontSize="small" />
              </ListItemIcon>
              <ListItemText>Create Group</ListItemText>
            </MenuItem>
          )}
          {selectedCount === 1 && (
            <MenuItem onClick={onDeleteSelected}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </>
      ) : (
        // Group creation form
        <Box sx={{ p: 1, minWidth: 250 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBackToMenu} sx={{ mr: 1 }}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2">Create Group</Typography>
          </Box>

          <TextField
            fullWidth
            label="Group Label"
            value={groupLabel}
            onChange={(e) => setGroupLabel(e.target.value)}
            autoFocus
            size="small"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={handleBackToMenu}
              color="secondary"
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleCreateGroupSubmit}
              disabled={!groupLabel.trim()}
            >
              Create
            </Button>
          </Box>
        </Box>
      )}
    </Menu>
  );
};

export default ContextMenu; 