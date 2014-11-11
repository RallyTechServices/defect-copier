Ext.override(Rally.ui.tree.ProjectTree, {
    childItemsStoreConfigForParentRecordFn: function(record){
    
        var storeConfig = {
            fetch: ['Name', 'Children:summary[State]', 'State', 'Workspace'],
            sorters: [{
                property: 'Name',
                direction: 'ASC'
            }]
        };
        
        if(record.get('_type') === 'workspace'){
            return Ext.apply(storeConfig, {
                filters: [{
                    property: 'Parent',
                    value: 'null'
                }],
                context: {
                    workspace: record.get('_ref'),
                    project: null
                }
            });
        } else {
            return Ext.apply(storeConfig, {
                fetch: ['Workspace','Name'],
                filters: [{
                    property: 'Parent',
                    value: record.get('_ref')
                }],
                context: {
                    workspace: record.get('Workspace')._ref,
                        project: null
                    }
                });
        }
    }
});