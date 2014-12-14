Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    source_defect: null,
    target_workspace: null,
    target_project: null,
    target_defect: null,
    fields_to_replace: [],
    items: [
        {xtype:'container', itemId:'button_box', defaults: {margin: 5} },
        {xtype:'container', itemId:'display_box', defaults: {margin: 5} },
        {xtype:'container', itemId:'input_box', defaults: {margin: 5} },
        {xtype:'container', itemId:'log_box', defaults: {margin: 10}, items: [
            { xtype:'container', itemId: 'log_title', html: 'Log', margin: 5 }
        ]},
        {xtype:'tsinfolink'}
    ],
    launch: function() {
        this._addButtons(this.down('#button_box'));
    },
    _addButtons: function(container) {
        container.add({
            xtype:'rallybutton',
            text: 'Select Defect',
            itemId: 'select_defect_button',
            listeners: {
                scope: this,
                click: this._chooseDefect
            }
        });
        
        container.add({
            xtype:'rallybutton',
            text: 'Select Destination',
            itemId: 'select_destination_button',
            listeners: {
                scope: this,
                click: this._chooseTarget
            }
        });
        
    },
    _chooseDefect: function(button) {
        Ext.create('Rally.ui.dialog.ChooserDialog', {
            artifactTypes: ['defect'],
            autoShow: true,
            title: 'Choose Defect',
            listeners: {
                artifactChosen: function(selectedRecord){
                    this.source_defect = selectedRecord;
                    this.target_defect = null;
                    this._updateSelectionDisplay();
                },
                scope: this
            }
         });
    },
    _chooseTarget: function(button) {
        Ext.create('Rally.technicalservices.dialog.ProjectChooserDialog', {
             autoShow: true,
             title: 'Choose Workspace and Project',
             listeners: {
                scope: this,
                targetChosen: function(selectedProject) {
                    this.target_project = selectedProject;
                    this.target_workspace = this.target_project.get('Workspace');
                    
                    this._updateSelectionDisplay();
                }
             }
         });
    },
    _logToScreen: function(msg) {
        this.down('#log_box').add({xtype:'container',html:" -- " + msg});
    },
    _updateSelectionDisplay: function() {
        var container = this.down('#display_box');
        container.removeAll();
        
        this.logger.log( "Defect to Copy: ", this.source_defect);
        this.logger.log( "Target Workspace: ",  this.target_workspace);
        this.logger.log( "Target Project: ", this.target_project);
        
        var source_defect_display_string = "Defect Not Selected";
        if ( this.source_defect ) {
            var source_defect_display_string =  this.source_defect.get('FormattedID') + ": " + this.source_defect.get('Name');
        }
        
        var target_workspace_display_string = "Workspace Not Selected";
        if ( this.target_workspace ) {
            target_workspace_display_string = this.target_workspace.Name ;
        }
        var target_project_display_string = "Project Not Selected";
        if ( this.target_project ) {
            target_project_display_string = this.target_project.get('Name');
        }
        
        var target_display_string = "Not yet copied";
        if ( this.target_defect ) {
            var target_url = Rally.nav.Manager.getDetailUrl(this.target_defect);
            var target_id = this.target_defect.get('FormattedID');
            var target_name = this.target_defect.get('Name');
            
            target_display_string = "<a href='" + target_url + "'>" + target_id + ":" + target_name + "</a>";
        }
        
        container.add({
            xtype:'container', 
            html: '<strong>Source Defect: </strong> ' + source_defect_display_string
        });
        
        container.add({
            xtype:'container', 
            html: '<strong>Target Workspace: </strong> ' + target_workspace_display_string
        });
        
        container.add({
            xtype:'container', 
            html: '<strong>Target Project: </strong> ' + target_project_display_string
        });
        
        container.add({
            xtype:'container',
            html: '<br/><br/><strong>New Defect: </strong> ' + target_display_string
        });
        
        if ( this.source_defect && this.target_project ) {
            this._addNotesBox();
        }
    },
    _addNotesBox: function() {
        this.down('#input_box').removeAll();
        
        this.down('#input_box').add({
            xtype:'rallybutton',
            text: 'Create Copy',
            itemId: 'copy_button',
            listeners: {
                scope: this,
                click: function() {
                    this.fields_to_replace = [];
                    this._copyDefect(this.source_defect, this.target_workspace, this.target_project.getData());
                }
            }
        });
    },
    _copyDefect: function(defect_record, workspace_hash, project_hash ) {
        this.setLoading("Creating new defect...");
        this._logToScreen("Beginning copy");
        
        this.logger.log("Copying ", defect_record, " to ", workspace_hash, project_hash);
        // go get the full copy of the existing record, then clean it of unnecessary fields and
        // then copy it to the other place
        Rally.data.ModelFactory.getModel({
            type: 'Defect',
            scope: this,
            success: function(model) {
                model.load(defect_record.get('ObjectID'), {
                    scope: this,
                    callback: function(result, operation) {
                        if(operation.wasSuccessful()) {
                            var target_defect_hash = this._getHashFromRecord(result);
                            target_defect_hash.Workspace = workspace_hash;
                            target_defect_hash.Project = project_hash;
                            
                            this.logger.log(result,target_defect_hash);
                            var new_defect = Ext.create(model, target_defect_hash);
                            new_defect.save({
                                scope: this,
                                callback: function(result, operation) {
                                    if(operation.wasSuccessful()) {
                                        this._logToScreen("Copy successful");
                                        this.logger.log("Created ", result.get('FormattedID'), result.get('ObjectID'));
                                        this.target_defect = result;
                                                                                
                                        this.setLoading(false);
                                        this._updateSelectionDisplay();
                                        this.down('#copy_button').setDisabled(true);
                                    } else {
                                        this._logToScreen("Received an error");
                                        this.logger.log("ERROR:", operation);
                                        
                                        if ( operation.error && operation.error.errors ) {
                                            var errors = operation.error.errors;
                                            this._processErrors(errors, defect_record, workspace_hash, project_hash);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
        
    },
    _processErrors:function(errors, defect_record, workspace_hash, project_hash){
        var retry = false;
        Ext.Array.each(errors,function(error){
            this._logToScreen( error );
            if ( /Owner cannot be set/.test(error) ) {
                retry = true;
                this._logToScreen("NOTE: Setting Owner to blank");
                this.fields_to_replace.push("Owner","");
            }
            if ( /"Priority" must be a string/.test(error) ) {
                retry = true;
                this._logToScreen("NOTE: Setting Priority to blank");
                this.fields_to_replace.push("Priority","");
            }
            if ( /"Severity" must be a string/.test(error) ) {
                retry = true;
                this._logToScreen("NOTE: Setting Severity to blank");
                this.fields_to_replace.push("Severity","");
            }
        },this);
        if ( retry ) {
            this._logToScreen("Trying to copy again");
            this._copyDefect(defect_record, workspace_hash, project_hash );
        } else {
            alert("cannot copy defect");
            this.setLoading(false);
        }
        
    },
    _getHashFromRecord: function(record) {
        var record_data = record.getData();
        var fields_to_remove = [ 'Project', 'ObjectID', 'CreationDate', 'OpenedDate', 
                'Workspace', 'Project', 'Tags', 'Tasks', 'Duplicates', 'VersionId', 
                '_ref','_refObjectName','_refObjectUUID','Attachments','Blocker',
                'ChangeSets', 'DefectSuites','Discussion','DragAndDropRank','LastUpdateDate',
                'Milestones', 'RevisionHistory','TestCase','TestCaseResult','TestCaseStatus','TestCases'];
        Ext.Array.each(fields_to_remove,function(field_to_remove){
            record_data[field_to_remove] = null;
        });
        
        Ext.Array.each(this.fields_to_replace,function(field_to_replace) {
            delete record_data[field_to_replace];
        });
        
        return record_data;
    }
});