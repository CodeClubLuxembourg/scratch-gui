import React from 'react';
import defaultsdeep from 'lodash.defaultsdeep';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {intlShape, injectIntl} from 'react-intl';
import xhr from 'xhr';

import {defaultProjectId, goToErrorState, isFetchingProjectWithId} from '../reducers/project-id';
import {defaultProjectTitleMessages} from '../reducers/project-title';

const api = (options, token, callback) => {
    defaultsdeep(options, {
        host: process.env.API_HOST,
        headers: {},
        responseType: 'json'
    });
    defaultsdeep(options, {
        uri: options.host + options.path,
        headers: {},
        responseType: 'json'
    });
    if (token) {
        options.headers['X-Token'] = token;
    }

    xhr(options, (err, res, body) => {
        if (err) {
            callback({
                isError: true,
                error: err
            });
        }
        callback(body);
    });
};

/* Higher Order Component to get and set project metadata; currently only uses title.
 * @param {React.Component} WrappedComponent component to receive project title related props
 * @returns {React.Component} component with project loading behavior
 */
const ProjectMetaDataHOC = function (WrappedComponent) {
    class ProjectMetaDataComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'updateProjectMetaData'
            ]);
            this.updateProjectMetaData(props.projectId);
        }
        componentWillReceiveProps (nextProps) {
            if (nextProps.isFetchingProjectWithId && !this.props.isFetchingProjectWithId) {
                this.updateProjectMetaData(nextProps.projectId);
            }
            // // if projectId has changed, and not just from one default value to
            // // another equivalent value, look up project metadata
            // if (this.props.projectId !== nextProps.projectId &&
            //     ((this.props.projectId !== defaultProjectId &&
            //     this.props.projectId !== null &&
            //     typeof this.props.projectId !== 'undefined') ||
            //     (nextProps.projectId !== defaultProjectId &&
            //     nextProps.projectId !== null &&
            //     typeof nextProps.projectId !== 'undefined'))) {
            //     this.updateProjectMetaData(nextProps.projectId);
            // }
        }
        // handleRequestNewProject (callback) {
        //     // pass the request up the chain
        //     this.props.onRequestNewProject(newProjectId => {
        //         // now that parents have had chance to act and change the projectId,
        //         // update the metadata using the projectId -- even if it is the
        //         // same projectId as before.
        //         // this.updateProjectMetaData(newProjectId);
        //         if (callback) callback(newProjectId); // pass the callback down the chain
        //     });
        // }
        updateProjectMetaData (projectId) {
            if (projectId === defaultProjectId || projectId === null || typeof projectId === 'undefined') {
                // if project is default, use static data
                const newProjectTitle =
                    this.props.intl.formatMessage(defaultProjectTitleMessages.defaultProjectTitle);
                this.props.onUpdateProjectTitle(newProjectTitle);
            } else {
                // not using default project, so fetch from api
                api({
                    path: `/projects/${projectId}`
                },
                null,
                // this.props.token,
                response => {
                    if (response.isError) {
                        this.props.goToErrorState(`Error fetching project metadata: ${response.error}`);
                    } else { // success
                        this.props.onUpdateProjectTitle(response.title);
                    }
                });
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                goToErrorState: goToErrorStateProp,
                intl,
                isFetchingProjectWithId: isFetchingProjectWithIdProp,
                projectId,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    // onRequestNewProject={this.handleRequestNewProject}
                    {...componentProps}
                />
            );
        }
    }

    ProjectMetaDataComponent.propTypes = {
        goToErrorState: PropTypes.func,
        intl: intlShape.isRequired,
        isFetchingProjectWithId: PropTypes.bool,
        onUpdateProjectTitle: PropTypes.func,
        projectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        // token: PropTypes.string
    };

    const mapStateToProps = state => {
        const projectState = state.scratchGui.projectId.projectState;
        return {
            isFetchingProjectWithId: isFetchingProjectWithId(projectState),
            projectId: state.scratchGui.projectId.projectId
            // token: state.session.session && state.session.session.user && state.session.session.user.token
        };
    };

    const mapDispatchToProps = dispatch => ({
        goToErrorState: errStr => dispatch(goToErrorState(errStr))
    });

    return injectIntl(connect(mapStateToProps, mapDispatchToProps)(ProjectMetaDataComponent));
};

export {
    ProjectMetaDataHOC as default
};
