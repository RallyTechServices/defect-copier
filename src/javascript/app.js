Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    source_defect: null,
    target_workspace: null,
    target_project: null,
    target_defect: null,
    fields_to_replace: [],
    new_owner: null,
    items: [
        {xtype:'container', itemId:'button_box', layout: { type:'hbox' }, defaults: {margin: 5} },
        {xtype:'container', layout: { type:'hbox' }, defaults: {margin: 25}, width: 800, items: [
            {xtype:'container', itemId:'display_box', defaults: {margin: 5} },
            {xtype:'container', itemId:'input_box', height: 300, defaults: {margin: 5} }
        ]},
        {xtype:'container', itemId:'log_box', defaults: {margin: 10}, height: 200, items: [
            { xtype:'container', itemId: 'log_title', html: '<strong>Log</strong>', margin: 5 }
        ]},
        {xtype:'tsinfolink'}
    ],
    launch: function() {
        this._addSelectors(this.down('#button_box'));
    },
    _addSelectors: function(container) {
        container.add({
            fieldLabel: 'Target Project',
            labelWidth: 75,
            labelAlign: 'top',
            xtype:'rallyprojectpicker',
            listeners: {
                scope: this,
                change: function(picker) {
                    this.target_project = picker.getSelectedRecord();
                    this.target_workspace = this.target_project.get('Workspace');
                    this._updateSelectionDisplay();
                    //me.selected_project = this.getSelectedRecord();
                }
            }
        });
        
        container.add({
            xtype:'rallybutton',
            text: 'Choose Defect',
            itemId: 'select_defect_button',
            margin: '15 0 0 10',
            listeners: {
                scope: this,
                click: this._chooseDefect
            }
        });
                

    
//        container.add({
//            xtype:'rallybutton',
//            text: 'Select Destination',
//            itemId: 'select_destination_button',
//            listeners: {
//                scope: this,
//                click: this._chooseTarget
//            }
//        });
        
    },
    _chooseDefect: function(button) {
        var height = this.getHeight() || 500;
        var width = this.getWidth() || 300;
        
        if ( width > 500 ) {
            width = 500;
        }
        if ( height > 550 ) {
            height = 550;
        }
        this.logger.log("height, width", height, width);
        if ( height < 200 ) {
            alert("The app panel is not tall enough to allow for defect selection");
        } else {
            Ext.create('Rally.ui.dialog.ChooserDialog', {
                artifactTypes: ['defect'],
                autoShow: true,
                title: 'Choose Defect',
                width: width,
                filterableFields: [
                    {
                        displayName: 'Name',
                        attributeName: 'Name'
                    },
                    {
                        displayName: 'Formatted ID',
                        attributeName: 'FormattedID'
                    }
                ],
                storeConfig: {
                    fetch: ['Notes']
                },
                gridConfig: {
                    height: height-100
                },
                listeners: {
                    artifactChosen: function(selectedRecord){
                        this.source_defect = selectedRecord;
                        this.target_defect = null;
                        this._updateSelectionDisplay();
                    },
                    scope: this
                }
             });
        }
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
            this._addNotesBox(this.source_defect);
        }
    },
    _addNotesBox: function(source_defect) {
        this.new_owner = null;
        this.down('#input_box').removeAll();
        
        this.down('#input_box').add({
            xtype:'container',
            itemId:'field_box'
        });
        
        this.down('#field_box').add({
            xtype:'container',
            html:'<strong>Owner to Place on Target Defect</strong>'
        });
        
        this.down('#field_box').add({
            xtype: 'rallyusersearchcombobox',
            itemId: 'owner_field',
            project: this.target_project.get('_ref'),
            listeners: {
                scope: this,
                change: function( user_box ) {
                    this.new_owner = user_box.getRecord();
                }
            }
        });
        
        this.down('#field_box').add({
            xtype:'container',
            html:'<strong>Notes to Place on Target Defect</strong>'
        });
        
        var notes = this._constructTargetNotes(source_defect);
        
        this.down('#field_box').add({
            itemId:'notes_field',
            xtype:'rallyrichtexteditor',
            value: notes
        });
        
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
    _constructTargetNotes:function(source_defect){
        var notes = source_defect.get('Notes');
        var url = Rally.nav.Manager.getDetailUrl(source_defect);
        var link = "<a href='" + url + "'>Original Defect: " + source_defect.get('FormattedID') + "</a>";
        
        return link + "<br/>" + notes;
    },
    _copyDefect: function(defect_record, workspace_hash, project_hash ) {
        this.setLoading("Creating new defect...");
        this._logToScreen("Beginning copy");
        
        // go get the full copy of the existing record, then clean it of unnecessary fields and
        // then copy it to the other place
        Rally.data.ModelFactory.getModel({
            type: 'Defect',
            scope: this,
            success: function(model) {
                model.load(defect_record.get('ObjectID'), {
                    scope: this,
                    callback: function(full_source_defect, operation) {
                        if(operation.wasSuccessful()) {
                            var target_defect_hash = this._getHashFromRecord(full_source_defect);
                            target_defect_hash.Workspace = workspace_hash;
                            target_defect_hash.Project = project_hash;
                            target_defect_hash.Notes = this.down('#notes_field').getValue();
                            this.logger.log("New Owner: ", this.new_owner);
                            if ( this.new_owner ) {
                                var owner = this.new_owner;
                                if ( owner.get('_ref') ) {
                                    target_defect_hash.Owner = owner.get('_ref');
                                } else {
                                    delete target_defect_hash['Owner'];
                                }
                            }

                            target_defect_hash.Notes = this.down('#notes_field').getValue();
                            
                            
                            var new_defect = Ext.create(model, target_defect_hash);
                            new_defect.save({
                                scope: this,
                                callback: function(result, operation) {
                                    if(operation.wasSuccessful()) {
                                        this._logToScreen("Copy successful");
                                        this.target_defect = result;

                                        this._updateSelectionDisplay();
                                        this.down('#copy_button').setDisabled(true);

                                        this._closeAndAddCreationDiscussionPost(full_source_defect,this.target_defect);

                                                                                
                                        if ( full_source_defect.get('Attachments').Count > 0 ) {
                                            this._logToScreen("Found " + full_source_defect.get('Attachments').Count + " attachments");
                                            this._copyAttachmentsForDefect(model, full_source_defect, this.target_defect);
                                        }
                    
                                        this.setLoading(false);
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
                '_ref','_refObjectName','_refObjectUUID','Blocker',
                'ChangeSets', 'DefectSuites','Discussion','DragAndDropRank','LastUpdateDate',
                'Milestones', 'RevisionHistory','TestCase','TestCaseResult','TestCaseStatus','TestCases'];
        Ext.Array.each(fields_to_remove,function(field_to_remove){
            record_data[field_to_remove] = null;
        });
        
        Ext.Array.each(this.fields_to_replace,function(field_to_replace) {
            delete record_data[field_to_replace];
        });
        
        return record_data;
    },
    _copyAttachmentsForDefect: function(model, source_defect, target_defect){
        this.setLoading("Copying Attachments");
        this.logger.log("_copyAttachmentsForDefect");
        var me = this;
        Rally.data.ModelFactory.getModel({
            type: 'Attachment',
            context: {
                workspace: me.target_workspace._ref,
                project: me.target_project.get('_ref')
            },
            success: function(model) {
                source_defect.getCollection('Attachments').load({
                    fetch: ['Content','ContentType','Description','Name','Size','Summary'],
                    callback: function(attachments, operation, success) {
                        me.setLoading("Copying Attachments");
                        var promises = [];
                        var number_of_items = attachments.length;
                        // slow down the creation a bit
                        for ( var i=0;i<number_of_items;i++ ) {
                            var item_array = attachments;
                            var f = function() {
                                var item = item_array[0];
                                item_array.shift();
                                return me._createAttachment(model,item,{ 
                                    Artifact: { 
                                        _ref: target_defect.get('_ref'),
                                        workspace: {
                                            _ref: me.target_workspace._ref
                                        }
                                    }
                                }, me);
                            };
                            promises.push(f);
                        }
                        Deft.Chain.sequence(promises).then({
                            success: function(records){
                                me.setLoading(false);
                            },
                            failure: function(error) {
                                me._logToScreen("Problem saving attachments: " + error);
                                me.setLoading(false);
                            }
                        });
                    }
                });
            }
        });
        return;
    },
    _createAttachment: function(attachment_model,source_item,change_fields, me){
        var deferred = Ext.create('Deft.Deferred');
                
        if ( ! source_item.get('Content') ) { 
            deferred.resolve([]);
        } else {
            var content_oid = source_item.get('Content').ObjectID;
            
            Rally.data.ModelFactory.getModel({
                type: 'AttachmentContent',
                context: {
                    workspace: me.target_workspace._ref,
                    project: me.target_project.get('_ref')
                },
                success: function(ac_model) {
                    
                    ac_model.load(content_oid,{
                        fetch: ['Content'],
                        callback: function(result,operation) {
                            var content = result.get('Content');
                            
                            var copied_content = Ext.create(ac_model,{
                                Content: content,
                                Workspace: me.target_workspace._ref
                            });
                            
                            copied_content.save({
                                callback: function(result,operation){
                                    if ( !result || !result.get('ObjectID') ) {
                                        deferred.resolve([]);
                                    } else {
                                        var content_oid = result.get('ObjectID');

                                        change_fields.Content = content_oid;
                                        var item = me._cleanseItem(source_item.getData(),change_fields);
                                        item['workspace'] = me.target_workspace._ref;
                                        item['project'] = me.target_project.get('_ref');

                                        var record = Ext.create(attachment_model, item );
                                        me._logToScreen("Saving attachment");
                                        record.save({
                                            callback: function(result, operation) {
                                                me.logger.log(" -- Back from trying to create ", attachment_model.getName(), item['Name']);
                                                if(operation.wasSuccessful()) {
                                                    deferred.resolve([source_item,result]);
                                                } else {
                                                    var message = attachment_model.getName();
                                                    if ( item['Name'] ) {
                                                        message += "\n" + item['Name'];
                                                    }
                                                    
                                                    if ( operation.error.errors && operation.error.errors.length > 0 ) {
                                                        message += "\n" + operation.error.errors[0];
                                                    }
                                                    me.logger.log(" !! ERROR ", message, operation );
                                                    deferred.reject("Could not save " + message);
                                                }
                                            }
                                        });
                                    }   
                                }
                            });
                        }
                    });
                }
            });
        }

        return deferred.promise;
    },
    _cleanseItem: function(original_item,change_fields){
        var item = Ext.clone(original_item);
        // remove unnecessary fields
        delete item['Artifact'];
        delete item['ObjectID'];
        delete item['Children'];
        delete item['CreationDate'];
        delete item['FormattedID'];
        delete item['Parent'];
        delete item['Subscription'];
        delete item['TestCases'];
        delete item['Workspace'];
        delete item['creatable'];
        delete item['updatable'];
        delete item['deletable'];
        delete item['_type'];
        delete item['_CreatedAt'];
        delete item['_objectVersion'];
        delete item['_p'];
        delete item['_ref'];
        delete item['_refObjectName'];
        
        
        return Ext.Object.merge(item, change_fields);
    },
    _closeAndAddCreationDiscussionPost: function(source_item,target_item){
        var url = Rally.nav.Manager.getDetailUrl(target_item);
        var link = "Copied this item to: <a href='" + url + "'>" + target_item.get('FormattedID') + "</a>";
        var notes = link + " (in the workspace called " + this.target_workspace.Name + ")";
        this._logToScreen("Adding copy information to note");

        this._closeDefect(source_item).then({
            scope: this,
            success: function() {
                this._addNoteToSource(source_item, notes);
            },
            failure: function(msg) {
                //
            }
        });
        return;
    },
    _closeDefect: function(source_item) {
        var deferred = Ext.create('Deft.Deferred');
        source_item.set('State','Closed');
        source_item.save({
            scope: this,
            callback: function(result, operation) {
                if(operation.wasSuccessful()) {
                    this._logToScreen("Closed defect");
                    deferred.resolve();
                } else {
                   
                    if ( operation.error.errors && operation.error.errors.length > 0 ) {
                        this._logToScreen("Failed to close defect:" +  operation.error.errors[0]);
                    }
                }
            }
        });
        return deferred.promise;
    },
    _addNoteToSource: function(artifact, text) {
        this.logger.log("_addNoteToSource",artifact,text);
        var notes = artifact.get('Notes');
        
        artifact.set('Notes',text + notes);
        artifact.save({
            scope: this,
            callback: function(result, operation) {
                if(operation.wasSuccessful()) {
                    this._logToScreen("Finished updating note on source");
                } else {
                   
                    if ( operation.error.errors && operation.error.errors.length > 0 ) {
                        this._logToScreen("Failed to update note on source:" +  operation.error.errors[0]);
                    }
                }
            }
        });
    },
    _addDiscussionPost:function(artifact, text) {
        this.logger.log("_addDiscussionPost",artifact,text);
        var item = {
            Artifact: { _ref: artifact.get('_ref') },
            Text: text
        };
        
        Rally.data.ModelFactory.getModel({
            type: 'ConversationPost',
            scope: this,
            success: function(model) {
                var record = Ext.create(model, item );
                record.save({
                    scope: this,
                    callback: function(result, operation) {
                        if(operation.wasSuccessful()) {
                            this._logToScreen("Finished creating discussion post");
                        } else {
                           
                            if ( operation.error.errors && operation.error.errors.length > 0 ) {
                                this._logToScreen("Failed to create post:" +  operation.error.errors[0]);
                            }
                        }
                    }
                });
            }
        });
        return;
    }
}); 