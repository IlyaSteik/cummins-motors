import React, {PureComponent} from "react";
import './header.css';

import * as VKID from '@vkid/sdk';
import Button from "../../components/button/button";
import {setLocalStorageData, vkApi} from "../../utils/utils";
import Select from "../../components/select/select";
import {Alert} from "@vkontakte/vkui";
import Input from "../../components/input/input";
import {ReactComponent as Logo} from '../../assets/images/logo.svg';
import {ReactComponent as IconSandwich} from "../../assets/icons/sandwich.svg";
import {ReactComponent as IconChevron} from "../../assets/icons/chevron_down.svg";

import {tabs} from "../tab-bar/tab-bar";

VKID.Config.set({
    app: 51898243,
    redirectUrl: 'https://adminbase.ru',
});

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            menu_open: false,
            active_menu_tabs: []
        }

        this.switchMenu = this.switchMenu.bind(this);
    }

    async changeTab(index, click) {
        await this.props.main.setState({activeHeaderTab: index, activeLeftTab: 0});
        if (click && typeof click === 'function') {
            try {
                await click();
            } catch (e) {
                console.error('header -> changeTab', e);
            }
        } else if (click && typeof click === 'number') {
            await this.props.main.setState({activeLeftTab: click});
        }

        if (this.props.main.mobile) {
            this.switchMenu();
        }
    }

    async switchMenu() {
        document.getElementById('main').style.overflow = this.state.menu_open ? '' : 'hidden';
        this.setState({menu_open: !this.state.menu_open});
    }

    componentDidMount() {
        /*const oneTap = new VKID.OneTap();
        const container = document.getElementById('header-vk-button');
        oneTap.render({
            container,
            scheme: 'light',
            showAlternativeLogin: true
        });*/
    }

    render() {
        const {main, activeTab, userData} = this.props;
        const {user_data} = main.state;
        const {menu_open, active_menu_tabs} = this.state;
        const headers = [
            {text: 'Постер'},
            {text: 'Истории'},
            {text: 'Рассылки'},
            {text: 'Дополнительно'}
        ];
        return (
            <div className='header main-block'>
                {
                    main.mobile ?
                        <React.Fragment>
                            <Logo className='logo'/>
                            <IconSandwich className='sandwich' onClick={this.switchMenu}/>
                            <div className='menu main-block' style={menu_open ? {
                                maxHeight: '100%',
                                opacity: 1,
                                bottom: 0,
                                zIndex: 3
                            } : {
                                maxHeight: 0,
                                opacity: 0,
                                pointerEvents: 'none'
                            }}>
                                {
                                    headers.map((header, ind) =>
                                        <div key={`header-${ind}`} onClick={(e) => {
                                            if (e.target.className && (e.target.className === 'button' || e.target.className === 'button-in')) {
                                                return;
                                            }

                                            if (tabs(user_data)[ind]) {
                                                if (active_menu_tabs.indexOf(ind) > -1) {
                                                    active_menu_tabs.splice(active_menu_tabs.indexOf(ind), 1);
                                                } else {
                                                    active_menu_tabs.push(ind);
                                                }
                                                this.setState({active_menu_tabs});
                                                this.forceUpdate();
                                            } else {
                                                this.changeTab(ind);
                                            }
                                        }}>
                                            <div>
                                                <h2>{header.text}</h2>
                                                {
                                                    tabs(user_data)[ind] &&
                                                    <IconChevron style={{
                                                        transform: active_menu_tabs.indexOf(ind) > -1 && 'rotate(180deg)'
                                                    }}/>
                                                }
                                            </div>
                                            <div style={{
                                                maxHeight: active_menu_tabs.indexOf(ind) === -1 ? 0 : 1000,
                                                visibility: active_menu_tabs.indexOf(ind) === -1 && 'hidden'
                                            }}>
                                                {
                                                    tabs(user_data)[ind] && tabs(user_data)[ind].map((tab, index) =>
                                                        <Button key={`tab-${index}`} onClick={(e) => {
                                                            this.changeTab(ind, index);
                                                        }} mode='secondary'>
                                                            {tab.text}
                                                        </Button>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    )
                                }

                                <div id='header-vk-button'>
                                    {
                                        userData && userData.access_token &&
                                        <div className='header-user-info'>
                                            <img alt='avatar' src={userData.photo_100}/>
                                            <span>{userData.first_name} {userData.last_name}</span>
                                            <Button
                                                mode='secondary'
                                                onClick={() => {
                                                    setLocalStorageData('auth_data', null);
                                                    main.setState({user_data: null});
                                                    this.switchMenu();
                                                }}
                                            >
                                                Выйти
                                            </Button>
                                        </div>
                                    }
                                </div>
                            </div>
                        </React.Fragment>
                        :
                        <React.Fragment>
                            {
                                headers.map(({text, click}, index) =>
                                    <button
                                        key={`header-${index}`}
                                        className={`header-button header-text ${activeTab === index ? 'header-button-active' : ''}`}
                                        onClick={() => this.changeTab(index, click)}
                                    >
                                        {text}
                                    </button>
                                )
                            }
                            <div id='header-vk-button'>
                                {
                                    userData && userData.access_token ?
                                        <div className='header-user-info'>
                                            <img alt='avatar' src={userData.photo_100}/>
                                            <span>{userData.first_name} {userData.last_name}</span>
                                            <Button
                                                mode='secondary'
                                                onClick={() => {
                                                    setLocalStorageData('auth_data', null);
                                                    main.setState({user_data: null});
                                                }}
                                            >
                                                Выйти
                                            </Button>
                                        </div>
                                        :
                                        <Button
                                            onClick={() => {
                                                VKID.Auth.login()
                                            }}
                                        >
                                            Войти через VK
                                        </Button>
                                }
                            </div>
                        </React.Fragment>
                }
            </div>
        );
    }
}