import * as anchor from '@coral-xyz/anchor';
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from '@solana/web3.js';
import { Votingdapp } from '../target/types/votingdapp';

describe('Local Test', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Votingdapp as Program<Votingdapp>;

  console.log(program.programId.toString())

  test("Initialize Poll", async () => {
    await program.methods.initializePoll(
      new anchor.BN(1),
      new anchor.BN(0),
      new anchor.BN(1759508293),
      "What type of destination you like for your trip?",
    ).rpc();
    // It takes seed and program id
    const [pollAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
    ], program.programId)

    const poll = await program.account.pollAccount.fetch(pollAddress)

    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual("What type of destination you like for your trip?")
    expect(poll.pollStart.toNumber()).toBeLessThan(Date.now() / 1000)
    expect(poll.pollEnd.toNumber()).toBeGreaterThan(Date.now() / 1000)
  });

  test("Initilize Candidate", async () => {
    await program.methods.initializeCandidate(
      new anchor.BN(1),
      "Mountains",
    ).rpc()

    await program.methods.initializeCandidate(
      new anchor.BN(1),
      "Beach",
    ).rpc()

    const [mountainAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
      Buffer.from("Mountains"),
    ], program.programId);

    const [beachAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
      Buffer.from("Beach"),
    ], program.programId);

    const mountainCandidate = await program.account.candidateAccount.fetch(mountainAddress);
    expect(mountainCandidate.candidateName).toEqual("Mountains")
    expect(mountainCandidate.candidateVotes.toNumber()).toEqual(0)

    const beachCandidate = await program.account.candidateAccount.fetch(beachAddress);
    expect(beachCandidate.candidateName).toEqual("Beach")
    expect(beachCandidate.candidateVotes.toNumber()).toEqual(0)

    const [pollAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
    ], program.programId)

    const poll = await program.account.pollAccount.fetch(pollAddress)
    expect(poll.candidateAmount.toNumber()).toEqual(2);

  })

  test("Initilize Voting", async () => {
    await program.methods.vote(
      new anchor.BN(1),
      "Mountains",
    ).rpc()

    try {
      await program.methods.vote(
        new anchor.BN(1),
        "Mountains",
      ).rpc()
      fail("Expected the second vote to fail")
    } catch (e: any) {
      console.log(e)
    }

    const [mountainAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
      Buffer.from("Mountains"),
    ], program.programId);

    const [beachAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
      Buffer.from("Beach"),
    ], program.programId);

    const mountainCandidate = await program.account.candidateAccount.fetch(mountainAddress);
    expect(mountainCandidate.candidateVotes.toNumber()).toEqual(1)

    const beachCandidate = await program.account.candidateAccount.fetch(beachAddress);
    expect(beachCandidate.candidateVotes.toNumber()).toEqual(0)

  })
});

// To test it without having to deploy 
// ❯ anchor test --skip-local-validator --skip-deploy

