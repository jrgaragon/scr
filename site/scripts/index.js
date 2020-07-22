var app = new Vue({
    el: '#app-main-gallery',
    data: {
        galleries: [],
        imageId: '',
        alerts: {
            success: {
                message: '',
                show: false
            },
            error: {
                message: '',
                show: false
            }
        }
    },
    mounted() {
        axios.get("http://localhost:3000/petite/galleries").then(response => {
            this.galleries = response.data;
        });
    },
    methods: {
        setDownload: function (galleryId) {
            let vm = this;
            axios.post(`http://localhost:3000/petite/admin/download/${
                galleryId
            }`).then(response => {
                if (response.data.status === 'done') {
                    vm.alerts.success.show = true;
                    vm.alerts.success.message = `Done: [${
                        response.data.message
                    }]`;
                    setTimeout(() => {
                        vm.alerts.success.show = false;
                        vm.alerts.success.message = '';
                    }, 5000)
                }
            }).catch(e => {
                console.log(JSON.stringify(e));
                vm.alerts.error.show = true;
                vm.alerts.error.message = e.response.data.message;
                setTimeout(() => {
                    vm.alerts.error.show = false;
                    vm.alerts.error.message = '';
                }, 10000);
            });
        }
    }
});