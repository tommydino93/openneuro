// dependencies -------------------------------------------------------

import React       from 'react';
import pluralize   from 'pluralize';
import DirUpload   from './dirUpload.component.jsx';
import DirTree     from './dirTree.component.jsx';
import UploadAlert from '../common/partials/alert.component.jsx';
import validate    from 'bids-validator';
import scitran     from '../utils/scitran';
import files       from '../utils/files';
import Progress    from './progress.component.jsx';
import DirValidationMessages from './dirValidationMessages.component.jsx';
import ValidationResults from './validationResults.component.jsx';
import {PanelGroup, Accordion, Panel, Alert} from 'react-bootstrap';

let Upload = React.createClass({

// life cycle events --------------------------------------------------

	getInitialState () {
		return {
			tree: [],
			list: {},
			errors: [],
			warnings: [],
			dirName: '',
			alert: false,
			uploading: false,
			validating: false,
			totalErrors: 0,
			totalWarnings: 0,
			progress: {total: 0, completed: 0, currentFiles: []}
		};
	},

	componentDidMount () {
		let self = this;
	},

	render () {

		// short references
		let self = this;
		let tree = this.state.tree;
		let errors = this.state.errors;
		let warnings = this.state.warnings;
		let dirName = this.state.dirName;
		let totalErrors = this.state.totalErrors;
		let totalWarnings = this.state.totalWarnings;
		let warningCount = pluralize('Warning', totalWarnings);
		let errorCount = pluralize('Error', totalErrors);
		let warningFilesCount = pluralize('File', warnings.length);
		let errorFilesCount = pluralize('File', errors.length);

		let errorsFilename = dirName+"_errors.json"
		let errorLink = (
			<a download={dirName + "_errors.json"} className="error-log" target="_blank" href={this._generateErrorLog(errors, warnings)}>
				Download error log for {dirName}
			</a>
		);

		// validations errors and warning wraps
		let validationMessages;
		if (tree.length > 0) {
			validationMessages = <ValidationResults errors={errors} warnings={warnings} />
		}

		let uploadFileStructure;
		if (tree.length > 0) {
			uploadFileStructure = (
				<span>
					{errorLink}
					<Accordion className="fileStructure fadeIn">
						<Panel header="View File Structure" eventKey='1'>
					  		<DirTree tree={tree}/>
					  	</Panel>
				  	</Accordion>
				 </span>
			);
		}

		let initialMessage = <span className="message fadeIn">Upload a BIDS dataset.<br/> <small><a href="http://bids.neuroimaging.io" target="_blank">Click to view details on BIDS specification</a></small></span>;
		let warningsMessage = <span className="message error fadeIn">We found {totalWarnings} {warningCount} in your dataset. Proceed with this dataset by clicking continue or fix the issues and select your folder again.</span>;
		let errorMessage = (
			<span className="message error fadeIn">Your dataset is not a valid BIDS dataset. Fix the <strong>{totalErrors} {errorCount}</strong> and upload your dataset again.<br/> 
				<small><a href="http://bids.neuroimaging.io" target="_blank">Click to view details on BIDS specification</a></small>
			</span>
		);

		// select, upload & continue btns
		let buttons;
		if (tree.length > 0 && errors.length === 0 && warnings.length > 0) {
			buttons = (
				<div className="warning-btn-group clearfix">
					<DirUpload onChange={self._onChange} />
					<div className="validate-buttons">
						<button onClick={this._upload.bind(this, null)} className="continueWarning btn-blue">Continue</button>
					</div>
				</div>
			);
		} else {
			buttons = <DirUpload onChange={self._onChange} />;
		}

		let dirHeader;
		if (tree.length > 0) {
			dirHeader = (
				<h3 className="dir-name">
					<i className="folderIcon fa fa-folder-open" /> 
					{dirName}
				</h3>
			);
		}

		let messages = (
			<span>
				{!this.state.uploading && tree.length === 0 && errors.length === 0 ? initialMessage : null }
				{tree.length > 0 && errors.length === 0 && warnings.length > 0 ? warningsMessage : null}
				{tree.length > 0 && errors.length > 0 ? errorMessage : null}
			</span>
		);

		let uploadAccordion = (
			<PanelGroup className="upload-accordion" defaultActiveKey='1' accordion>
				<Panel className="upload-panel" header='Upload Dataset' eventKey='1'>
					<div>
						<div className="upload-wrap">
							{buttons}
							{dirHeader}
							{messages}
						</div>
						{validationMessages}
						{uploadFileStructure}
					</div>
				</Panel>
			</PanelGroup>
		);

		let alert;
		if (this.state.alert) {
			alert = (
				<Alert className="fadeInDown clearfix" bsStyle='success'>
					<div className="alert-left"><strong>Success!</strong> Your Dataset has been added and saved to your Dashboard. </div> <button className="alert-right dismiss-button-x" onClick={this._closeAlert}> <i className="fa fa-times"></i> </button>
				</Alert>
			);
		}

		return (
			<div className={this.state.uploading ? 'right-sidebar uploading' : 'right-sidebar'}>
				<div className="upload-nav">
					<h2>My Tasks</h2>
				</div>
				{alert}
				{this.state.uploading ? <Progress progress={this.state.progress} header={dirHeader} /> : uploadAccordion}
			</div>
    	);
	},

// custom methods -----------------------------------------------------

	/**
	 * On Change
	 *
	 * On file select this adds files to the state
	 * and starts validation.
	 */
	_onChange (selectedFiles) {
		let self = this;
		this.setState({
			tree: selectedFiles.tree,
			list: selectedFiles.list,
			dirName: selectedFiles.tree[0].name,
			validating: !self.state.validating,
		});
		this._validate(selectedFiles);
	},

	/**
	 * Validate
	 *
	 * Takes a filelist, runs BIDS validation checks
	 * against it, and sets any errors to the state.
	 */
	_validate (selectedFiles) {
		let self = this;

        validate.BIDS(selectedFiles.list, function (errors, warnings) {
        	errors   = errors   ? errors   : [];
        	warnings = warnings ? warnings : [];

        	let totalErrors = 0;  
        	let totlalWarnings = 0;
			for (let error   of errors)   {totalErrors    += error.errors.length;}
            for (let warning of warnings) {totlalWarnings += warning.errors.length;}

			self.setState({
				errors: errors,
				totalErrors: totalErrors,
				warnings: warnings,
				totalWarnings: totlalWarnings
			});

			if (errors.length === 0) {
				if (warnings.length === 0) {
					self._upload(selectedFiles);
					self.setState({uploading: true});
				}
			}
        });
	},

	/**
	 * Upload
	 *
	 * Uploads currently selected and triggers
	 * a progress event every time a file or folder
	 * finishes.
	 */
	_upload (selectedFiles) {
		let self = this;
		let fileTree = selectedFiles ? selectedFiles.tree : this.state.tree;
		let count = files.countTree(fileTree);

		scitran.upload(fileTree, count, function (progress) {
			self.setState({
				progress: progress,
				uploading: true
			});
			if (progress.total === progress.completed) {
				self._uploadComplete();
			}
		});
	},

	/**
	 * Upload Complete
	 *
	 * Resets the componenent state to its
	 * initial state. And creates an upload
	 * complete alert.
	 */
	_uploadComplete () {
		let initialState = this.getInitialState();
		initialState.alert = true;
		this.replaceState(initialState);
	},

	/**
	 * Close Alert
	 *
	 * Closes the upload finished alert.
	 */
	_closeAlert () {
		let self = this;
		self.setState({alert: false});
	},

	/**
	 * Generate Error Log
	 *
	 * Takes an array of errors and an array of
	 * warnings and returns a pretty printed
	 * JSON data url of the contents.
	 */
	_generateErrorLog (errors, warnings) {
		let issues = errors.concat(warnings);
		for (let issue of issues) {
			issue.file.path = issue.file.webkitRelativePath;
		}
		let errorLog = JSON.stringify(issues, null, "  ");
		let errorURL = "data:application/octet-stream;charset=utf-8," + encodeURIComponent(errorLog);
		return errorURL;
	}

});


export default Upload;