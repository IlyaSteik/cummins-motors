import React, {PureComponent} from "react";
import './tab-bar.css';
import {ReactComponent as Logo} from '../../assets/images/logo.svg';
import {Alert} from "@vkontakte/vkui";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import {setLocalStorageData, vkApi} from "../../utils/utils";

export const tabs = (user_data) => [
    [
        {
            text: 'Сообщества',
            click: () => {
            }
        },
        {
            text: 'Накрутка',
            click: () => {
            }
        },
        {
            text: 'Постинг',
            click: () => {
            }
        },
        {
            text: 'Удаление постов',
            click: () => {
            }
        },
        {
            text: 'Текущие задачи',
            click: () => {
            }
        }
    ],
    [
        {
            text: 'Сообщества',
            click: () => {
            }
        },
        ...(user_data && user_data.admin) ? [
            {
                text: 'Общие медиа',
                click: () => {
                }
            },
        ] : [],
        {
            text: 'Медиа',
            click: () => {
            }
        },
        {
            text: 'Постинг',
            click: () => {
            }
        },
        {
            text: 'Текущие задачи',
            click: () => {
            }
        }
    ],
    [
        {
            text: 'Сообщества',
            click: () => {
            }
        },
        {
            text: 'Шаблоны',
            click: () => {
            }
        },
        {
            text: 'Рассылки',
            click: () => {
            }
        }
    ],
    [
        {
            text: 'Реферальная система',
            click: () => {
            }
        },
        {
            text: 'Контакты',
            click: () => {
            }
        }
    ]
];

export default class extends PureComponent {

    constructor(props) {
        super(props);
    }

    async changeTab(index, click) {
        await this.props.main.setState({activeLeftTab: index});
        try {
            await click();
        } catch (e) {
            console.error('tab-bar -> changeTab', e);
        }
    }

    render() {
        const {main, activeTab, activeHeader, isAuth} = this.props;
        const {user_data} = main.state;

        return (
            <div className='tab-bar main-block'>
                <Logo className='logo' onClick={() => {
                    /*main.setPopout(
                        <Alert
                            actionsLayout='vertical'
                            onClose={() => main.setPopout(null)}
                            header='Новый профиль'
                        >
                            <Input
                                className='token_input'
                            />
                            <div style={{height: 12}}/>
                            <Button
                                size='l'
                                onClick={async () => {
                                    const access_token = document.getElementsByClassName('token_input')[0].getElementsByTagName('input')[0].value;
                                    const user_id = (await vkApi('users.get', {access_token})).response[0].id;
                                    setLocalStorageData('auth_data', JSON.stringify({user_id, access_token}));
                                    window.location.reload();
                                }}
                            >
                                Применить
                            </Button>
                        </Alert>
                    )*/
                }}/>
                {
                    isAuth && tabs(user_data).map((head, ind) =>
                        head.map(({text, click}, index) =>
                            <button
                                key={`tab-${ind}-${index}`}
                                className={`tab header-text ${activeTab === index ? 'tab-active' : ''}`}
                                style={{
                                    display: (ind === activeHeader) ? '' : 'none'
                                }}
                                onClick={() => this.changeTab(index, click)}
                            >
                                {text}
                            </button>
                        )
                    )
                }
            </div>
        );
    }
}