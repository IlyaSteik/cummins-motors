import React from "react";
import {defaultViewProps, initializeNavigation} from "./utils/navigation";
import {Panel, View, ScreenSpinner, Alert, PopoutWrapper} from "@vkontakte/vkui";

import './assets/css/fonts.css';
import './assets/css/main.css';
import './assets/css/mobile.css';

import Tabbar from "./panels/tab-bar/tab-bar";
import Header from "./panels/header/header";
import Content from "./panels/content/content";
import {
    api,
    apiPost,
    getLocalStorageData,
    getUrlParams,
    openUrl,
    setLocalStorageData,
    sleep,
    vkApi
} from "./utils/utils";
import fetch from "node-fetch";
import Button from "./components/button/button";
import Input from "./components/input/input";
import Select from "./components/select/select";
import eruda from 'eruda';

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
        };

        initializeNavigation.bind(this)('main');

        this.error = (e) => {
            this.setAlert('Ошибка', e.message || (e.error && e.error.descr) || e, [
                {
                    title: 'Ок',
                    autoclose: true,
                    action: () => {
                    }
                },
            ]);
            console.error(e);
        }
    }

    async componentDidMount() {

    }

    render() {
        const {

        } = this.state;
        return (
            <View {...defaultViewProps.bind(this)()}>
                <Panel id='main' className={this.mobile ? 'mobile' : 'desktop'}>

                </Panel>
            </View>
        );
    }

}