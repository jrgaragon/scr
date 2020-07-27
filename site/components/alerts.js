Vue.component('notification', {
    props: ['alerts'],
    template: 
    `
    <div>
        <div class="alert alert-success fixed-top" role="alert" v-show="alerts.success.show">
            {{alerts.success.message}}
        </div>
        <div class="alert alert-danger" role="alert" v-show="alerts.error.show">
            {{alerts.error.message}}
        </div>
    </div>
    `,
    data() {
        return {

        }
    }
});