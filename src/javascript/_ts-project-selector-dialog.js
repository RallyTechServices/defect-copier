Ext.define('Rally.technicalservices.dialog.ProjectChooserDialog', {
    extend: 'Rally.ui.dialog.Dialog',        
    alias:'widget.tsprojectchooserdialog',
    margin: 10,
    items: {
        xtype: 'panel',
        border: false,
        items: [
            {
                xtype: 'container',
                itemId: 'selector_box',
                layout: 'fit'
            }
        ]
    },
    
    width: 250,
    config: {
        /**
         * @cfg {String}
         * Text to be displayed on the button when selection is complete
         */
        selectionButtonText: 'Done'
    },
    
    constructor: function(config) {
        this.mergeConfig(config);

        this.callParent([this.config]);
    },
    
    initComponent: function() {
        this.callParent(arguments);
        this.addEvents(
            /**
             * @event targetChosen
             * Fires when user clicks done after choosing project/workspace
             * 
             * @param {Rally.technicalservices.dialog.ProjectChooserDialog} this
             * @param {Rally.domain.WsapiModel} selected project
             */
            'targetChosen'
        );

        this.addCls('chooserDialog');

        this._buildButtons();
        this._addProjectSelector();
    },
    
    _addProjectSelector: function(){
        var me = this;
        
        this.down('#selector_box').add({
            xtype:'rallyprojectpicker',
            listeners: {
                change: function() {
                    me.selected_project = this.getSelectedRecord();
                }
            }
        });
    },
    /**
     * @private
     */
    _buildButtons: function() {

        this.down('panel').addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            ui: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    text: this.selectionButtonText,
                    cls: 'primary small',
                    scope: this,
                    userAction: 'clicked done in dialog',
                    handler: function() {
                        this.fireEvent('targetChosen', this.selected_project);
                        this.close();
                    }
                },
                {
                    xtype: 'rallybutton',
                    text: 'Cancel',
                    cls: 'secondary small',
                    handler: this.close,
                    scope: this,
                    ui: 'link'
                }
            ]
        });

    }
});
