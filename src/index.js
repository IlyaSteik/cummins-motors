import React from 'react';
import ReactDOM from 'react-dom';
import '@vkontakte/vkui/dist/vkui.css';
import '@vkontakte/vkui/dist/unstable.css'
import {
    AdaptivityProvider,
    ConfigProvider,
    AppRoot,
    WebviewType,
} from "@vkontakte/vkui";

import App from './main';
import {createBrowserRouter, RouterProvider} from "@vkontakte/vk-mini-apps-router";

class Application extends React.Component {

    get router() {
        return createBrowserRouter([
            {
                path: '/',
                panel: '',
                view: ''
            }
        ]);
    }

    render() {
        return (
            <ConfigProvider webviewType={WebviewType.INTERNAL}>
                <AdaptivityProvider>
                    <AppRoot>
                        <RouterProvider router={this.router}>
                            <App/>
                        </RouterProvider>
                    </AppRoot>
                </AdaptivityProvider>
            </ConfigProvider>
        );
    }

}

ReactDOM.render(<Application/>, document.getElementById('root'));