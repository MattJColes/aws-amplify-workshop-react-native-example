exports.handler = async (event, context) => {
    console.log('event: ', event)
    const body = {
      message: "Hello world!"
    }
    const response = {
      statusCode: 200,
      body
    }
    return response
  }