Ext.override(Rally.ui.dialog.ChooserDialog,{
    items: {
        xtype: 'panel',
        border: false,
        items: [
            {
                xtype: 'container',
                itemId: 'gridContainer',
                layout: 'fit'
            }
        ]
    }
});