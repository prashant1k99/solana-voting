import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS } from "@solana/actions"
export const OPTIONS = GET
export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkHeN-5BP2Dic56fbsE7T9RKXEyWPjpgEJZQ&s",
    title: "Vote for your favourite trip destination type",
    description: "Vote between Beach and Mountains",
    label: "Vote",
    links: {
      actions: [
        {
          type: "transaction",
          href: "/api/vote?candidate=mountains",
          label: "Vote for Mountains",
        },
        {
          type: "transaction",
          href: "/api/vote?candidate=beach",
          label: "Vote for Beaches",
        }
      ]
    }
  }

  // This allows CORS handling for unknown source
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS })
}
