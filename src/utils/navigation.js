import React from 'react';
import {Alert, Snackbar} from "@vkontakte/vkui";
import {sleep} from "./utils";

export function initializeNavigation(firstPanel = 'main') {
    this.back = async () => {
        if (this.state.popout !== null && this.state.popout !== undefined) {
            this.setState({popout: null});
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }
        let {history} = this.state;
        if (history.length > 1) {
            history.pop();
            await this.setState({activePanel: history[history.length - 1], history, snackbar: null});
        }
    };
    this.go = (panel) => {
        let {history} = this.state;
        if (typeof panel === 'object' && panel.currentTarget)
            panel = panel.currentTarget.dataset.to;

        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');
            this.setState({activePanel: panel, history, snackbar: null});
        }
    }
    this.setActiveModal = (activeModal) => {
        this.setState({activeModal});
    }
    this.setActivePanel = (activePanel, history) => {
        this.setState({activePanel, history: history ? [...history, activePanel] : [activePanel]});
    }
    this.setPopout = (popout) => {
        this.setState({popout});
    }
    this.setSnackbar = async (text) => {
        if (this.state.snackbar) {
            await this.setState({snackbar: null});
            await sleep(100);
        }
        this.setState({
            snackbar: <Snackbar onClose={() => this.setState({snackbar: null})}>
                {text}
            </Snackbar>
        });
    };

    this.setAlert = (title = '', description = '', buttons = [{
        title: 'Ок',
        autoclose: true
    }]) => {
        const desc_inner = description.includes('\n');
        this.setPopout(
            <Alert
                actions={buttons}
                actionsLayout='vertical'
                onClose={() => this.setPopout(null)}
                header={title}
                text={desc_inner === false ? description : ''}
            >
                {
                    desc_inner &&
                    <span
                        id="vkui--alert--desc"
                        className="vkuiAlert__text Alert__text vkuiText Text vkuiText--sizeY-compact Text--sizeY-compact vkuiText--w-3 Text--w-3"
                    >
                        <div dangerouslySetInnerHTML={{__html: description.replaceAll('\n', '<br/>')}}/>
                    </span>
                }
            </Alert>
        );
    }

    this.state.history = [firstPanel];
    this.state.activePanel = firstPanel;
}

export function defaultViewProps() {
    return {
        activePanel: this.state.activePanel,
        onSwipeBack: this.back,
        history: this.state.history,
        popout: this.state.popout
    };
}