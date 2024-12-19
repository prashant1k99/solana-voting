import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { Votingdapp, VotingdappIDL } from "@project/anchor"
import { Program, BN } from "@coral-xyz/anchor"

export async function OPTIONS(_: Request) {
  return new Response(null, {
    headers: {
      ...ACTIONS_CORS_HEADERS,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  })
}

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
          href: "/api/vote?candidate=Mountains",
          label: "Vote for Mountains",
        },
        {
          type: "transaction",
          href: "/api/vote?candidate=Beaches",
          label: "Vote for Beaches",
        }
      ]
    }
  }

  // This allows CORS handling for unknown source
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const candidate = url.searchParams.get("candidate")

  if (!candidate || !["Mountains", "Beaches"].includes(candidate)) {
    return new Response("Invalid candidate", { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const connection = new Connection(process.env.CLUSTER_URL!, "confirmed")
  const program = new Program(VotingdappIDL as Votingdapp, {
    connection
  })

  const body: ActionPostRequest = await request.json()

  let voter: PublicKey

  try {
    voter = new PublicKey(body.account)
  } catch (error) {
    return new Response("Invalid Account", { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const instruction = await program.methods.vote(
    new BN(1),
    candidate,
  ).accounts({
    signer: voter
  }).instruction()

  const blockhash = await connection.getLatestBlockhash()

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  }).add(instruction)

  const response = await createPostResponse({
    fields: {
      type: "transaction",
      transaction,
    }
  })

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS })
}
