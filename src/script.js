let controller = new Controller();

render.on("NewReceiptEntrySaved", (event, sent_data) => {
    controller.load_data(sent_data.data)
})

render.on("AllChangesSaved", ()=>{
    controller.changed_data = {}
})