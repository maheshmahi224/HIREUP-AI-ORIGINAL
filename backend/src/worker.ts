// Adapter seam for a Cloudflare deployment. Use a MongoDB Atlas Data API adapter
// in Worker environments because the native MongoDB driver requires TCP sockets.
export default { async fetch(): Promise<Response> { return Response.json({error:{code:'WORKER_ADAPTER_REQUIRED',message:'Deploy the Node API adapter or configure a Workers-compatible Atlas adapter.'}},{status:501}); } };
